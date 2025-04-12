import image from '../assets/img/image.png'

const Services = (props) => {

    return(
        <div>
  <a href="#" className="btn btn-primary btn-icon-split">
    <span className="icon text-white-50">
        <img src={image} width={15} height={16} />
    </span>
    <span className="text">MySQL</span>
  </a>
  <a href="#" className="btn btn-secondary btn-icon-split">
    <span className="icon text-white-50">
        <img src={image} width={15} height={16} />
    </span>
    <span className="text">PostgreSQL</span>
  </a>
</div>

    )
}

export default Services;